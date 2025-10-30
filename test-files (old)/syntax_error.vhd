library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity syntax_error_example is
    Port ( clk : in STD_LOGIC;
           rst : in STD_LOGIC;
           data_in : in STD_LOGIC_VECTOR(7 downto 0);
           data_out : out STD_LOGIC_VECTOR(7 downto 0)
         );
end syntax_error_example;

architecture Behavioral of syntax_error_example is
    signal temp_data : STD_LOGIC_VECTOR(7 downto 0);
begin
    process(clk, rst)
    begin
        if rst = '1' then
            temp_data <= (others => '0');
        elsif rising_edge(clk) then
            temp_data <= data_in;
            data_out <= temp_data;  -- Missing semicolon here
        end if;
    end process;
end Behavioral;
