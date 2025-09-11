library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity complex_design is
    Port ( 
        clk : in STD_LOGIC;
        rst : in STD_LOGIC;
        start : in STD_LOGIC;
        data_in : in STD_LOGIC_VECTOR(31 downto 0);
        data_out : out STD_LOGIC_VECTOR(31 downto 0);
        done : out STD_LOGIC;
        error : out STD_LOGIC
    );
end complex_design;

architecture Behavioral of complex_design is
    type state_type is (IDLE, PROCESSING, ERROR_STATE, DONE_STATE);
    signal current_state, next_state : state_type;
    signal counter : unsigned(7 downto 0);
    signal temp_result : STD_LOGIC_VECTOR(31 downto 0);
    signal processing_done : STD_LOGIC;
    
    -- Complex processing function
    function complex_operation(input : STD_LOGIC_VECTOR(31 downto 0)) 
        return STD_LOGIC_VECTOR is
        variable result : STD_LOGIC_VECTOR(31 downto 0);
        variable temp : unsigned(31 downto 0);
    begin
        temp := unsigned(input);
        for i in 0 to 31 loop
            if temp(i) = '1' then
                temp := temp + 1;
            end if;
        end loop;
        result := STD_LOGIC_VECTOR(temp);
        return result;
    end function;
    
begin
    -- State machine process
    process(clk, rst)
    begin
        if rst = '1' then
            current_state <= IDLE;
            counter <= (others => '0');
            temp_result <= (others => '0');
            processing_done <= '0';
        elsif rising_edge(clk) then
            current_state <= next_state;
            
            case current_state is
                when IDLE =>
                    if start = '1' then
                        next_state <= PROCESSING;
                        counter <= (others => '0');
                        temp_result <= (others => '0');
                        processing_done <= '0';
                    end if;
                    
                when PROCESSING =>
                    if counter < 100 then
                        temp_result <= complex_operation(data_in);
                        counter <= counter + 1;
                    else
                        processing_done <= '1';
                        next_state <= DONE_STATE;
                    end if;
                    
                when ERROR_STATE =>
                    next_state <= IDLE;
                    
                when DONE_STATE =>
                    next_state <= IDLE;
            end case;
        end if;
    end process;
    
    -- Output assignments
    data_out <= temp_result when processing_done = '1' else (others => '0');
    done <= '1' when current_state = DONE_STATE else '0';
    error <= '1' when current_state = ERROR_STATE else '0';
    
end Behavioral;
