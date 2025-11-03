library IEEE;
use IEEE.STD_LOGIC_1164.all;

entity moore_fsm is
    port(
        x0, x1, start, CLK : in std_logic;
        y1, y2, y3 : out std_logic
    );
end moore_fsm;

architecture behavioral of moore_fsm is
    signal D, Q : std_logic_vector(1 downto 0);
    signal S0, S1, S2, S3 : std_logic;
begin
    process(CLK, start)
    begin
        if start = '0' then
            Q <= "00";
        elsif (CLK'event and CLK='0') then
            Q <= D;
        end if;
    end process;

    process(Q)
    begin
        S0 <= '0';
        S1 <= '0';
        S2 <= '0';
        S3 <= '0';
        case Q is
            when "00" => S0 <= '1';
            when "01" => S1 <= '1';
            when "10" => S2 <= '1';
            when "11" => S3 <= '1';
            when others => report "Error in Q" severity ERROR;
        end case;
    end process;

    process(x0,x1,S0,S1,S2,S3)
    begin
        D(0)<=S0 or (S2 and not x1);
        D(1)<=(S1 and x0) or (S2 and not x1) or S3;
        y1<=S1;
        y2<=S3;
        y3<=S2;
    end process;
end behavioral;